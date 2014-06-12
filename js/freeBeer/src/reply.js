/** @jsx React.DOM */

var PuffReplyForm = React.createClass({
    componentDidMount: function() {
        // set silly global this is very very dumb
        globalReplyFormSubmitArg = this.handleSubmit.bind(this);
        
        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);
        
        if(this.refs.content) {
            var content_el = this.refs.content.getDOMNode();
            if(content_el.focus)
                content_el.focus();
        }
    },
    componentDidUpdate: function() {
        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
    },
    getInitialState: function() {
        return {imageSrc: ''};
    },
    handleSubmit: function() {
        var type = this.props.reply.type;
        var content = '';
        var metadata = {};

        // THINK: allow the content type itself to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
            metadata.license = this.refs.imageLicense.getDOMNode().value;
        } else {
            content = this.refs.content.getDOMNode().value.trim();
        }

        var parents = this.props.reply.parents;
        if (content.length<CONFIG.minimumPuffLength) {
            alert("Not enough content");
            return false;
        }
        
        PuffForum.addPost( type, content, parents, metadata );

        return events.pub('ui/reply/submit', {'reply': {show: false, parents: []}});
    },
    handleImageLoad: function() {
        var self   = this;
        var reader = new FileReader();

        reader.onload = function(event){
            self.state.imageSrc = event.target.result;
            return events.pub('ui/reply/image-upload');
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0]);

        return false;
    },
    handleCancel: function() {
        // THINK: save the content in case they accidentally closed?
        return events.pub('ui/reply/cancel', {'reply': {show: false, parents: []}});
    },
    handlePickType: function() {
        var type = this.refs.type.getDOMNode().value;
        return events.pub('ui/reply/set-type', {'reply.type': type});
    },
    render: function() {
        var username = PuffWardrobe.getCurrentUsername() // make this a prop or something
        username = humanizeUsernames(username) || 'anonymous';

        var contentTypeNames = Object.keys(PuffForum.contentTypes)

        var type = this.props.reply.type;
        var typeFields = (
            <div>
                <textarea id="content" ref="content" name="content" className="mousetrap" rows="13" cols="50" placeholder="Add your content here. Click on the reply buttons of other puffs to reply to these."></textarea>
            </div>
            )

        // TODO: Did I hear someone say switch?
        if(type == 'image') {
            typeFields = (
                <div>
                    <div className="menuItem">
                        Image File:
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad} />
                    </div>
                    <br /><br />
                    <div className="menuItem">Image License:
                        <select id="imageLicense" name="imageLicense" ref="imageLicense">
                            <option value="Creative Commons Attribution">Creative Commons Attribution</option>
                            <option value="GNU Public License">GNU Public License</option>
                            <option value="Public domain">Public domain</option>
                            <option value="Rights-managed">Rights-managed</option>
                            <option value="Royalty-free">Royalty-free</option>
                        </select>
                    </div>
                    <br />
                        <img src={this.state.imageSrc} id="preview_image" />
                </div>

            )
        }
        else if(type == 'bbcode') {
            typeFields = (
                <div>
                    {typeFields}
                    <p>You can use BBCode-style tags</p>
                </div>
                )
        }

        if (typeof this.props.reply.parents != 'undefined') {
            var parents = this.props.reply.parents;
        } else {
            var parents = [];
        }

        if(parents.length) {
            var parentType = PuffForum.getPuffById(parents[0]).payload.type;
            console.log("Got type " + parentType);
        } else {
            var parentType = CONFIG.defaultContentType;
            console.log("We go with type " + parentType);
        }
        
        return (
            <div id="replyForm">
                <div id="replyFormBox">
                    <div id="authorDiv">{username}</div>
                    <form id="otherContentForm" onSubmit={this.handleSubmit}>

                        {typeFields}
                        <a href="#" onClick={this.handleCancel}><i className="fa fa-trash-o floatLeft"> NO!</i></a>
                        <select ref="type" className="btn" onChange={this.handlePickType} defaultValue={parentType}>
                            {contentTypeNames.map(function(type) {
                                return <option key={type} value={type}>{type}</option>
                            })}
                        </select>

                        {' '}<a href="#" onClick={this.handleSubmit}><i className="fa fa-paper-plane floatRight"> GO!</i></a>

                    </form>
                </div>
            </div>
            );
    }
});
